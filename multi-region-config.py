import boto3

# Multi-region AWS configuration
class MultiRegionAWS:
    def __init__(self):
        # Primary deployment region (Malaysia)
        self.primary_region = 'ap-southeast-5'
        
        # Service-specific regions
        self.regions = {
            'lambda': 'ap-southeast-5',      # Malaysia (primary)
            'api_gateway': 'ap-southeast-5', # Malaysia (primary)
            'dynamodb': 'ap-southeast-1',    # Singapore (existing)
            'comprehend': 'ap-southeast-1',  # Singapore (Comprehend not in MY)
            's3': 'ap-southeast-5',          # Malaysia
            'cloudwatch': 'ap-southeast-5'   # Malaysia
        }
    
    def get_client(self, service):
        region = self.regions.get(service, self.primary_region)
        return boto3.client(service, region_name=region)
    
    def get_dynamodb_client(self):
        # DynamoDB in Singapore
        return boto3.client('dynamodb', region_name='ap-southeast-1')
    
    def get_lambda_client(self):
        # Lambda in Malaysia
        return boto3.client('lambda', region_name='ap-southeast-5')

# Usage example
aws_config = MultiRegionAWS()
lambda_client = aws_config.get_lambda_client()
dynamo_client = aws_config.get_dynamodb_client()