import boto3
import os

from load_env import load_env_file
load_env_file()  # Load from .env.local


def check_dynamodb_regions():
    # Check Malaysia
    try:
        malaysia_client = boto3.client('dynamodb', region_name='ap-southeast-5')
        malaysia_tables = malaysia_client.list_tables()
        print(f"Malaysia DynamoDB: Available")
        print(f"Tables: {malaysia_tables['TableNames']}")
    except Exception as e:
        print(f"Malaysia DynamoDB: {e}")
    
    # Check Singapore
    try:
        singapore_client = boto3.client('dynamodb', region_name='ap-southeast-1')
        singapore_tables = singapore_client.list_tables()
        print(f"Singapore DynamoDB: Available")
        print(f"Tables: {singapore_tables['TableNames']}")
    except Exception as e:
        print(f"Singapore DynamoDB: {e}")

if __name__ == "__main__":
    check_dynamodb_regions()
