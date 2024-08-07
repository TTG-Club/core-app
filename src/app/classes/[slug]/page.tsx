export default function DetailClasses({ params }: { params: { slug: string } }) {
  return (
    <h1
      className=""
      key="home-page"
    >
      Detail class by {params.slug}
    </h1>
  );
}
