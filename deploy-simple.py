import boto3
import zipfile
import os

def deploy_lambda():
    # Create zip file
    with zipfile.ZipFile('trustbites-api.zip', 'w') as zip_file:
        zip_file.write('lambda-functions/api-gateway-handler.py', 'lambda_function.py')
    
    # Deploy using boto3
    lambda_client = boto3.client('lambda')
    
    with open('trustbites-api.zip', 'rb') as zip_file:
        try:
            response = lambda_client.create_function(
                FunctionName='trustbites-api',
                Runtime='python3.9',
                Role='arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role',
                Handler='lambda_function.lambda_handler',
                Code={'ZipFile': zip_file.read()},
                Description='TrustBites API Gateway Handler'
            )
            print("✅ Function created successfully!")
            print(f"Function ARN: {response['FunctionArn']}")
        except Exception as e:
            print(f"❌ Error: {e}")
    
    os.remove('trustbites-api.zip')

if __name__ == "__main__":
    deploy_lambda()