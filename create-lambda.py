import boto3
import zipfile
import os
from load_env import load_env_file

# Load environment variables from .env.local
load_env_file()
os.environ['AWS_DEFAULT_REGION'] = 'ap-southeast-5'

def create_lambda():
    # Create zip
    with zipfile.ZipFile('function.zip', 'w') as zip_file:
        zip_file.write('lambda-functions/api-gateway-handler.py', 'lambda_function.py')
    
    # Create function
    lambda_client = boto3.client('lambda')
    
    with open('function.zip', 'rb') as zip_file:
        response = lambda_client.create_function(
            FunctionName='trustbites-api',
            Runtime='python3.9',
            Role='arn:aws:iam::983615436528:role/service-role/lambda-basic-execution-role',
            Handler='lambda_function.lambda_handler',
            Code={'ZipFile': zip_file.read()},
            Description='TrustBites API Gateway Handler',
            Timeout=30
        )
    
    print(f"Created function: {response['FunctionName']}")
    print(f"ARN: {response['FunctionArn']}")
    
    # Cleanup
    os.remove('function.zip')

if __name__ == "__main__":
    create_lambda()