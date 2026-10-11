export const dynamic = 'force-dynamic';
import PageClient from './PageClient';
import { gatewayTestEnabled } from '@/lib/server/escrow-config.mjs';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	return <PageClient gigId={id} purchasesEnabled={gatewayTestEnabled()} />;
}
