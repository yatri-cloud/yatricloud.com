/**
 * Debug utility to test Udemy API connection
 * Run this in browser console to test your API token
 */

export async function testUdemyAPI() {
  const token = import.meta.env.VITE_UDEMY_INSTRUCTOR_TOKEN;
  
  if (!token) {
    console.error('❌ No token found in .env file');
    return;
  }

  console.log('🔑 Token found:', token.substring(0, 10) + '...');
  console.log('🧪 Testing Udemy API connection...\n');

  // Test different endpoints and auth methods
  const endpoints = [
    {
      name: 'Instructor Taught Courses (Bearer)',
      url: 'https://www.udemy.com/api-2.0/users/me/taught-courses/',
      auth: `Bearer ${token}`,
    },
    {
      name: 'Instructor Taught Courses (Direct)',
      url: 'https://www.udemy.com/api-2.0/users/me/taught-courses/',
      auth: token,
    },
    {
      name: 'Instructor Courses',
      url: 'https://www.udemy.com/api-2.0/users/me/courses/',
      auth: `Bearer ${token}`,
    },
    {
      name: 'User Profile',
      url: 'https://www.udemy.com/api-2.0/users/me/',
      auth: `Bearer ${token}`,
    },
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Testing: ${endpoint.name}`);
      console.log(`   URL: ${endpoint.url}`);
      
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: {
          'Authorization': endpoint.auth,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('   ✅ SUCCESS!');
        console.log('   Response:', data);
        return { success: true, endpoint: endpoint.name, data };
      } else {
        const errorText = await response.text();
        console.log('   ❌ Failed');
        console.log('   Error:', errorText.substring(0, 200));
      }
    } catch (error) {
      console.log('   ❌ Exception:', error);
    }
  }

  console.log('\n\n💡 If all failed, check:');
  console.log('   1. Token is correct');
  console.log('   2. Token hasn\'t been revoked');
  console.log('   3. You have instructor access');
  console.log('   4. CORS is not blocking (might need backend proxy)');
}

// Make it available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).testUdemyAPI = testUdemyAPI;
}

