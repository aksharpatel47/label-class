export default function Page({ params }: { params: { id: string } }) {
  return <div> Review Project {params.id}</div>;
}
