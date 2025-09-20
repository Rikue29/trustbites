import boto3
import zipfile
import os
from load_env import load_env_file

# Load environment variables from .env.local
load_env_file()

def deploy_to_malaysia():
    # Create Lambda in Malaysia region
    lambda_client = boto3.client('lambda', region_name='ap-southeast-5')
    
    # Create zip
    with zipfile.ZipFile('function.zip', 'w') as zip_file:
        zip_file.write('lambda-functions/api-gateway-handler.py', 'lambda_function.py')
    
    try:
        with open('function.zip', 'rb') as zip_file:
            response = lambda_client.create_function(
                FunctionName='trustbites-malaysia-api',
                Runtime='python3.9',
                Role='arn:aws:iam::983615436528:role/service-role/lambda-basic-execution-role',
                Handler='lambda_function.lambda_handler',
                Code={'ZipFile': zip_file.read()},
                Description='TrustBites API - Malaysia Region',
                Timeout=30,
                Environment={
                    'Variables': {
                        'DYNAMODB_REGION': 'ap-southeast-1',  # DynamoDB in Singapore
                        'COMPREHEND_REGION': 'ap-southeast-1'  # Comprehend in Singapore
                    }
                }
            )
        
        print(f"SUCCESS: Lambda deployed to Malaysia!")
        print(f"Function: {response['FunctionName']}")
        print(f"Region: ap-southeast-5")
        print(f"Console: https://ap-southeast-5.console.aws.amazon.com/lambda/")
        
    except Exception as e:
        print(f"Error: {e}")
        if "InvalidParameterValueException" in str(e):
            print("Need to create IAM role first or use existing role")
    
    # Cleanup
    if os.path.exists('function.zip'):
        os.remove('function.zip')

if __name__ == "__main__":
    deploy_to_malaysia()
