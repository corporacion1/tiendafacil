// const fetch = require('node-fetch'); // Use global fetch

async function testDuplicateCustomer() {
    const phone = "0412" + Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    const storeId = "ST-1234567890123"; // Valid store ID

    const customer1 = {
        name: "Customer A",
        phone: phone,
        address: "Address A",
        storeId: storeId,
        id: `cust-${Date.now()}-1`
    };

    const customer2 = {
        name: "Customer B",
        phone: phone, // SAME PHONE
        address: "Address B",
        storeId: storeId,
        id: `cust-${Date.now()}-2`
    };

    try {
        console.log('1. Creating first customer...');
        const res1 = await fetch('http://localhost:3000/api/costumers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(customer1)
        });
        const data1 = await res1.json();
        if (!res1.ok) {
            console.error('❌ Failed to create first customer:', data1);
            return;
        }
        console.log('✅ First customer created:', data1.id);

        console.log('2. Creating duplicate customer...');
        const res2 = await fetch('http://localhost:3000/api/costumers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(customer2)
        });
        const data2 = await res2.json();

        if (res2.status === 409) {
            console.log('✅ Duplicate check PASSED. Got 409 Conflict as expected.');
            console.log('Error message:', data2.error);
        } else {
            console.error('❌ Duplicate check FAILED. Expected 409, got:', res2.status);
            console.log('Response:', data2);
        }

    } catch (error) {
        console.error('❌ Script Error:', error);
    }
}

testDuplicateCustomer();
