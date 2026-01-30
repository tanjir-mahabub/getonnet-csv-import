import { ImportSection } from '../components/Import';
import { CustomersSection } from '../components/Customers';

export function DashboardPage() {
    return (
        <div style={{ maxWidth: 960, margin: '40px auto' }}>
            <ImportSection />
            <CustomersSection />
        </div>
    );
}