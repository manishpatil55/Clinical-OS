import requests

BASE_URL = "http://localhost:8000"

def verify():
    # 1. Login
    print("🔑 Logging in as Admin...")
    resp = requests.post(f"{BASE_URL}/auth/token", data={"username": "admin", "password": "admin"})
    if resp.status_code != 200:
        print(f"❌ Login Failed: {resp.text}")
        return
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Logged In!")

    # 2. List Tenants (Should find HQ)
    print("\n📋 Listing Tenants...")
    resp = requests.get(f"{BASE_URL}/tenants", headers=headers)
    if resp.status_code == 200:
        tenants = resp.json()
        print(f"✅ Found {len(tenants)} tenants.")
        for t in tenants:
            print(f"   - {t['name']} ({t['domain']})")
    else:
        print(f"❌ List Failed: {resp.text}")

    # 3. Create Tenant
    print("\n⚡ Creating 'Apollo Clinic'...")
    new_tenant = {"name": "Apollo Clinic", "domain": "apollo"}
    resp = requests.post(f"{BASE_URL}/tenants", json=new_tenant, headers=headers)
    if resp.status_code == 200:
        print("✅ Tenant Created!")
    elif resp.status_code == 400 and "already exists" in resp.text:
       print("⚠️  Tenant already exists (Skipping creation).")
    else:
        print(f"❌ Create Failed: {resp.text}")

if __name__ == "__main__":
    verify()
