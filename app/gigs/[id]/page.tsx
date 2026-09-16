export const dynamic = 'force-dynamic';
import PageClient from './PageClient';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	return <PageClient gigId={id} />;
}
