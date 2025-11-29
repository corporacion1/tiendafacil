// Test script to verify /api/stores-admin/stats endpoint
async function testStatsAPI() {
    try {
        console.log('Testing /api/stores-admin/stats...');
        const response = await fetch('http://localhost:3000/api/stores-admin/stats');
        const data = await response.json();

        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log('✅ API is working!');
            console.log('Statistics:');
            console.log(`  - Total stores: ${data.total}`);
            console.log(`  - Active stores: ${data.active}`);
            console.log(`  - Inactive stores: ${data.inactive}`);
            console.log(`  - Production stores: ${data.production}`);
            console.log(`  - Total users: ${data.totalUsers}`);
            console.log(`  - Recent activity count: ${data.recentActivity?.length || 0}`);
        } else {
            console.error('❌ API returned error:', data);
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testStatsAPI();
