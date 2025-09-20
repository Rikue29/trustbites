import boto3
import zipfile
import json

def create_lambda_function():
    # Create zip file
    with zipfile.ZipFile('function.zip', 'w') as zip_file:
        zip_file.write('lambda-functions/api-gateway-handler.py', 'lambda_function.py')
    
    # Create Lambda function
    lambda_client = boto3.client('lambda', region_name='ap-southeast-1')
    
    with open('function.zip', 'rb') as zip_file:
        lambda_client.create_function(
            FunctionName='trustbites-api',
            Runtime='python3.9',
            Role='arn:aws:iam::123456789012:role/service-role/lambda-basic-execution',
            Handler='lambda_function.lambda_handler',
            Code={'ZipFile': zip_file.read()},
            Description='TrustBites API'
        )
    
    print("✅ Lambda function created!")

if __name__ == "__main__":
    create_lambda_function()