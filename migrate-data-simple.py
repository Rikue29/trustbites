import boto3
import os

from load_env import load_env_file
load_env_file()  # Load from .env.local


def migrate_data():
    sg_client = boto3.client('dynamodb', region_name='ap-southeast-1')
    my_client = boto3.client('dynamodb', region_name='ap-southeast-5')
    
    tables = ['Restaurants', 'Reviews', 'AnalysisResults']
    
    for table_name in tables:
        print(f"Migrating {table_name}...")
        
        try:
            response = sg_client.scan(TableName=table_name)
            items = response['Items']
            
            print(f"Found {len(items)} items in Singapore")
            
            for item in items:
                my_client.put_item(TableName=table_name, Item=item)
            
            print(f"Migrated {len(items)} items to Malaysia")
            
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    migrate_data()
