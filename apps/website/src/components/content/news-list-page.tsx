import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";

import { ContentList } from "./content-list";
import { ContentShell } from "../site/content-shell";
import { PageHero } from "../site/page-hero";
import { Button } from "@daegwang/web-ui/components/ui/button";
import type { ContentListItem } from "@daegwang/contracts/content/content-types";

export function NewsListPage({
  eyebrow,
  title,
  description,
  items,
  basePath,
  query = "",
}: {
  eyebrow: string;
  title: string;
  description: string;
  items: ContentListItem[];
  basePath: string;
  query?: string;
}) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} description={description} />
      <ContentShell>
        <Paper variant="outlined" className="mb-8 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-text-secondary">총 {items.length}건</p>
          <form className="flex gap-2">
            <TextField name="q" defaultValue={query} size="small" label={`${title} 검색`} placeholder="검색어 입력" className="w-full sm:w-64" />
            <Button type="submit">검색</Button>
          </form>
        </Paper>
        <ContentList items={items} basePath={basePath} />
      </ContentShell>
    </>
  );
}
