import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { cn } from '@/lib/utils/cn';

const schema = {
  tagNames: [
    'p',
    'br',
    'strong',
    'em',
    'del',
    'ul',
    'ol',
    'li',
    'blockquote',
    'h1',
    'h2',
    'h3',
    'h4',
    'a',
    'code',
    'pre',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'hr',
  ],
  attributes: {
    a: ['href', 'title', 'target', 'rel'],
    code: ['className'],
    th: ['align'],
    td: ['align'],
  },
  protocols: {
    href: ['http', 'https', 'mailto'],
  },
};

export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div
      className={cn(
        'prose-rtl max-w-none text-sm leading-relaxed text-foreground',
        '[&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:text-xl [&_h1]:font-bold',
        '[&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold',
        '[&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold',
        '[&_p]:my-3',
        '[&_ul]:my-3 [&_ul]:list-disc [&_ul]:ps-6',
        '[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:ps-6',
        '[&_li]:my-1',
        '[&_a]:text-primary [&_a]:underline',
        '[&_blockquote]:border-s-4 [&_blockquote]:border-border [&_blockquote]:ps-4 [&_blockquote]:text-muted-foreground',
        '[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-muted [&_pre]:p-4',
        '[&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm',
        '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
        '[&_table]:my-4 [&_table]:w-full [&_table]:text-start',
        '[&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:p-2',
        '[&_td]:border [&_td]:border-border [&_td]:p-2',
        '[&_hr]:my-6 [&_hr]:border-border',
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[[rehypeSanitize, schema]]}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
