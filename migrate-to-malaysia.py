import boto3
import os
from load_env import load_env_file

# Load environment variables from .env.local
load_env_file()

def create_tables_malaysia():
    malaysia_client = boto3.client('dynamodb', region_name='ap-southeast-5')
    
    # Create Restaurants table
    try:
        malaysia_client.create_table(
            TableName='Restaurants',
            KeySchema=[{'AttributeName': 'restaurantId', 'KeyType': 'HASH'}],
            AttributeDefinitions=[{'AttributeName': 'restaurantId', 'AttributeType': 'S'}],
            BillingMode='PAY_PER_REQUEST'
        )
        print("Created Restaurants table in Malaysia")
    except Exception as e:
        print(f"Restaurants table: {e}")
    
    # Create AnalysisResults table
    try:
        malaysia_client.create_table(
            TableName='AnalysisResults',
            KeySchema=[{'AttributeName': 'analysisId', 'KeyType': 'HASH'}],
            AttributeDefinitions=[{'AttributeName': 'analysisId', 'AttributeType': 'S'}],
            BillingMode='PAY_PER_REQUEST'
        )
        print("Created AnalysisResults table in Malaysia")
    except Exception as e:
        print(f"AnalysisResults table: {e}")

if __name__ == "__main__":
    create_tables_malaysia()