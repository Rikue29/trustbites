import boto3
import os
from load_env import load_env_file

# Load environment variables from .env.local
load_env_file()
os.environ['AWS_DEFAULT_REGION'] = 'ap-southeast-1'

try:
    # Test connection
    sts = boto3.client('sts')
    identity = sts.get_caller_identity()
    print(f"✅ Connected as: {identity['Arn']}")
    
    # List Lambda functions
    lambda_client = boto3.client('lambda')
    functions = lambda_client.list_functions()
    
    if functions['Functions']:
        print(f"\n📋 Found {len(functions['Functions'])} Lambda functions:")
        for func in functions['Functions']:
            print(f"  - {func['FunctionName']}")
    else:
        print("\n❌ No Lambda functions found. You need to create them first.")
        
except Exception as e:
    print(f"❌ Error: {e}")