export async function optimizeImage(file: File, budget: number, reencode = false): Promise<File> {
  if (file.size > 40 * 1024 * 1024) throw new Error(`${file.name}: 원본 이미지가 너무 큽니다. 40MB 이하 파일을 선택해 주세요.`);
  const url = URL.createObjectURL(file);
  const image = new Image();
  try {
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error(`${file.name}: 이미지를 읽을 수 없습니다. JPG·PNG·WebP 파일을 확인해 주세요.`)); image.src = url; });
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 60000000) throw new Error(`${file.name}: 이미지 해상도가 너무 큽니다. 6천만 화소 이하 파일을 선택해 주세요.`);
    let scale = Math.min(1, 2560 / Math.max(image.naturalWidth, image.naturalHeight));
    if (!reencode && scale === 1 && file.size <= budget) return file;
    const canvas = document.createElement('canvas');
    try {
      for (let attempt = 0; attempt < 8; attempt++) {
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        if (!context) throw new Error('이 브라우저에서 이미지 처리를 시작할 수 없습니다. 최신 브라우저로 다시 시도해 주세요.');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const type = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/webp';
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, Math.max(0.65, 0.88 - attempt * 0.04)));
        if (!blob) throw new Error(`${file.name}: 이미지 변환에 실패했습니다. 다시 선택해 주세요.`);
        if (blob.size <= budget) {
          const extension = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/jpeg' ? 'jpg' : 'png';
          return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.${extension}`, { type: blob.type, lastModified: file.lastModified });
        }
        scale *= 0.8;
      }
      throw new Error(`${file.name}: 자동 축소 후에도 용량이 큽니다. 이미지를 나눠 올려 주세요.`);
    } finally { canvas.width = 0; canvas.height = 0; }
  } finally { URL.revokeObjectURL(url); }
}

