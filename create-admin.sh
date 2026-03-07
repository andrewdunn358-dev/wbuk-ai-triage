#!/bin/bash
echo "Creating admin user for WBUK Triage Platform"
echo ""
read -p "Admin email: " ADMIN_EMAIL
read -s -p "Admin password: " ADMIN_PASSWORD
echo ""
read -p "Admin name: " ADMIN_NAME

docker exec wbuk-backend python3 -c "
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import os

async def create_admin():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client['wbuk_triage']
    password_hash = bcrypt.hashpw('$ADMIN_PASSWORD'.encode(), bcrypt.gensalt()).decode()
    await db.admin_users.update_one(
        {'email': '$ADMIN_EMAIL'},
        {'\$set': {
            'email': '$ADMIN_EMAIL',
            'name': '$ADMIN_NAME',
            'password_hash': password_hash,
            'role': 'super_admin',
            'is_active': True
        }},
        upsert=True
    )
    print('Admin user created!')

asyncio.run(create_admin())
"
echo ""
echo "Done! Login at http://radiocheck.org.uk/admin"
