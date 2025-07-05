import ReactMarkdown from 'react-markdown';
// import remarkMath from 'remark-math';
// import rehypeKatex from 'rehype-katex';
// import 'katex/dist/katex.min.css';

export default function AIMessage({ content }: { content: string }) {
  return (
    <div className="prose prose-sm sm:prose-base max-w-none">
      <ReactMarkdown
        children={content}
        // remarkPlugins={[remarkMath]}
        // rehypePlugins={[rehypeKatex]}
      />
    </div>
  );
} 