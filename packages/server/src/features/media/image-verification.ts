import sharp from 'sharp';
export async function verifyImageBytes(bytes:Buffer,mime:string){
 const image=sharp(bytes,{limitInputPixels:16_000_000,failOn:'warning'});
 const meta=await image.metadata();
 if(!meta.width||!meta.height||meta.width>4096||meta.height>4096||(meta.pages??1)>1||`image/${meta.format}`!==mime)throw Error('INVALID_IMAGE');
 // Decode pixels too: a plausible header alone does not prove the file is complete.
 await image.stats();return {width:meta.width,height:meta.height};
}
