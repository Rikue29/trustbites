import boto3
import os
from load_env import load_env_file

# Load environment variables from .env.local
load_env_file()

def migrate_data():
    # Source (Singapore) and destination (Malaysia) clients
    sg_client = boto3.client('dynamodb', region_name='ap-southeast-1')
    my_client = boto3.client('dynamodb', region_name='ap-southeast-5')
    
    tables = ['Restaurants', 'Reviews', 'AnalysisResults']
    
    for table_name in tables:
        print(f"Migrating {table_name}...")
        
        try:
            # Scan all items from Singapore
            response = sg_client.scan(TableName=table_name)
            items = response['Items']
            
            print(f"Found {len(items)} items in Singapore {table_name}")
            
            # Copy each item to Malaysia
            for item in items:
                my_client.put_item(TableName=table_name, Item=item)
            
            print(f"✅ Migrated {len(items)} items to Malaysia {table_name}")
            
        except Exception as e:
            print(f"❌ Error migrating {table_name}: {e}")

if __name__ == "__main__":
    migrate_data()