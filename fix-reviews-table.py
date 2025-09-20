import boto3
import os

from load_env import load_env_file
load_env_file()  # Load from .env.local


def fix_reviews_table():
    my_client = boto3.client('dynamodb', region_name='ap-southeast-5')
    
    # Delete and recreate Reviews table with correct schema
    try:
        my_client.delete_table(TableName='Reviews')
        print("Deleted existing Reviews table")
        
        # Wait for deletion
        waiter = my_client.get_waiter('table_not_exists')
        waiter.wait(TableName='Reviews')
        
        # Create with correct key
        my_client.create_table(
            TableName='Reviews',
            KeySchema=[{'AttributeName': 'reviewId', 'KeyType': 'HASH'}],
            AttributeDefinitions=[{'AttributeName': 'reviewId', 'AttributeType': 'S'}],
            BillingMode='PAY_PER_REQUEST'
        )
        print("Created Reviews table with reviewId key")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_reviews_table()
