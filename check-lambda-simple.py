import boto3
import os

# Set credentials from env
from load_env import load_env_file
load_env_file()  # Load from .env.local

os.environ['AWS_DEFAULT_REGION'] = 'ap-southeast-1'

try:
    # Test connection
    sts = boto3.client('sts')
    identity = sts.get_caller_identity()
    print(f"Connected as: {identity['Arn']}")
    
    # List Lambda functions
    lambda_client = boto3.client('lambda')
    functions = lambda_client.list_functions()
    
    if functions['Functions']:
        print(f"Found {len(functions['Functions'])} Lambda functions:")
        for func in functions['Functions']:
            print(f"  - {func['FunctionName']}")
    else:
        print("No Lambda functions found. You need to create them first.")
        
except Exception as e:
    print(f"Error: {e}")
