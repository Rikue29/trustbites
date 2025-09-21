// Simple curl commands to test TrustBites Authentication
// Copy and paste these commands in a new terminal

echo "🚀 TrustBites Authentication Test Commands"
echo "=========================================="
echo ""

echo "1️⃣ Test Registration:"
echo 'curl -X POST http://localhost:3000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@trustbites.com\",\"password\":\"SecurePassword123\",\"confirmPassword\":\"SecurePassword123\",\"ownerName\":\"John Doe\",\"businessName\":\"John Restaurant\"}"'
echo ""

echo "2️⃣ Test Login (save the cookie):"
echo 'curl -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@trustbites.com\",\"password\":\"SecurePassword123\"}" ^
  -c cookies.txt'
echo ""

echo "3️⃣ Test Auth Check:"
echo 'curl -X GET http://localhost:3000/api/auth/check ^
  -b cookies.txt'
echo ""

echo "4️⃣ Test Protected Dashboard:"
echo 'curl -X GET http://localhost:3000/api/dashboard/summary ^
  -b cookies.txt'
echo ""

echo "5️⃣ Test Dashboard Without Auth (should fail):"
echo 'curl -X GET http://localhost:3000/api/dashboard/summary'
echo ""

echo "6️⃣ Test Logout:"
echo 'curl -X POST http://localhost:3000/api/auth/logout ^
  -b cookies.txt'
echo ""

echo "7️⃣ Test Global Restaurant Search:"
echo 'curl "http://localhost:3000/api/restaurants/search?location=Kuala+Lumpur,Malaysia&radius=5000"'
echo ""

echo "🎉 Run these commands one by one to test the system!"