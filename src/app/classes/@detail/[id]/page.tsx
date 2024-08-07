export default function Page({ params }: { params?: { id?: string } }) {
  return (
    <div
      className=""
      key="class-detail-page"
    >
      {params?.id} WOHO!
    </div>
  );
}
