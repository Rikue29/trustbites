#!/usr/bin/env python3
"""
Deploy Lambda functions to AWS
"""

import boto3
import zipfile
import os
import json
from pathlib import Path

# AWS Configuration
AWS_REGION = 'ap-southeast-1'
LAMBDA_ROLE_ARN = 'arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role'

def create_lambda_zip(function_name, source_file):
    """Create deployment zip for Lambda function"""
    zip_path = f"{function_name}.zip"
    
    with zipfile.ZipFile(zip_path, 'w') as zip_file:
        zip_file.write(source_file, 'lambda_function.py')
    
    return zip_path

def deploy_function(lambda_client, function_name, zip_path, handler='lambda_function.lambda_handler'):
    """Deploy or update Lambda function"""
    
    with open(zip_path, 'rb') as zip_file:
        zip_content = zip_file.read()
    
    try:
        # Try to update existing function
        response = lambda_client.update_function_code(
            FunctionName=function_name,
            ZipFile=zip_content
        )
        print(f"✅ Updated function: {function_name}")
        
    except lambda_client.exceptions.ResourceNotFoundException:
        # Create new function
        response = lambda_client.create_function(
            FunctionName=function_name,
            Runtime='python3.9',
            Role=LAMBDA_ROLE_ARN,
            Handler=handler,
            Code={'ZipFile': zip_content},
            Description=f'TrustBites {function_name}',
            Timeout=30,
            MemorySize=256,
            Environment={
                'Variables': {
                    'AWS_REGION': AWS_REGION
                }
            }
        )
        print(f"✅ Created function: {function_name}")
    
    return response

def main():
    # Initialize AWS client
    lambda_client = boto3.client('lambda', region_name=AWS_REGION)
    
    # Functions to deploy
    functions = [
        ('trustbites-api-gateway', 'lambda-functions/api-gateway-handler.py'),
        ('trustbites-comprehend-analyzer', 'lambda-functions/comprehend-analyzer.py'),
        ('trustbites-google-scraper', 'lambda-functions/google-maps-scraper.py'),
        ('trustbites-places-scraper', 'lambda-functions/google-places-scraper.py')
    ]
    
    print("🚀 Deploying Lambda functions...\n")
    
    for function_name, source_file in functions:
        if os.path.exists(source_file):
            print(f"📦 Packaging {function_name}...")
            zip_path = create_lambda_zip(function_name, source_file)
            
            try:
                deploy_function(lambda_client, function_name, zip_path)
            except Exception as e:
                print(f"❌ Failed to deploy {function_name}: {e}")
            
            # Cleanup
            os.remove(zip_path)
        else:
            print(f"⚠️  Source file not found: {source_file}")
    
    print(f"\n🎉 Deployment complete! Check AWS Console:")
    print(f"https://{AWS_REGION}.console.aws.amazon.com/lambda/")

if __name__ == "__main__":
    main()