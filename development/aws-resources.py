"""
Tested with python 3.8.10 
Require `pip install python-dotenv`

Usage: python3 ./path/to/this/script.py ./path/to/your/.env
"""

import subprocess, sys
from dotenv import dotenv_values

aws_profile = 'playground'
brand = '<your-brand-name>'
service = '<your-service-name>'
stage = '<stage>'   # eg: dev / stg

ssm_types = {
    'text': 'String',
    'secure': 'SecureString'
}

values = dotenv_values(sys.argv[1])

# This is just an example. Edit it to match with your environment variables
ssm_parameters = [
    (f'/{service}/{stage}/magento/host', values['MAGENTO_HOST'], ssm_types['text']),
    (f'/{service}/{stage}/magento/access_token', values['MAGENTO_ACCESS_TOKEN'], ssm_types['secure']),
]

try:
    subprocess.run(['aws', 'configure', '--profile', aws_profile, 'set', 'cli_follow_urlparam', 'false'])
except Exception as exp:
    print(exp)

for param in ssm_parameters:
  try:
    print(f'Putting {param[0]} as {param[2]} to {aws_profile}')
    result = subprocess.run(['aws', 'ssm', 'put-parameter', '--profile', aws_profile, '--name', param[0], '--value', param[1], '--type', param[2], '--overwrite'], capture_output=True, text=True)
    print(result.stdout)
  except Exception as exp:
    print(exp)

# VPC: https://docs.aws.amazon.com/vpc/latest/userguide/vpc-subnets-commands-example.html
# Create VPC with a 10.0.0.0/16 CIDR block
# aws ec2 create-vpc --profile aws_profile --cidr-block 10.0.0.0/16 --query Vpc.VpcId --output text
# aws ec2 create-subnet --profile aws_profile --vpc-id vpc_id --cidr-block 10.0.1.0/24
# aws ec2 create-subnet --profile aws_profile --vpc-id vpc_id --cidr-block 10.0.0.0/24