interface Window {
  supabase: any;
  supabaseClient: any;
  DiaryMarkdown: DiaryMarkdownApi;
  marked: any;
  DOMPurify: any;
}

interface DiaryMarkdownApi {
  render(source: string): string;
}

declare const supabase: any;
declare const DOMPurify: any;
declare const marked: any;
declare const Quill: any;
