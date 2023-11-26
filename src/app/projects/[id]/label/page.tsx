export default function Page({ params }: { params: { id: string } }) {
  return <div>Label Project {params.id}</div>;
}
