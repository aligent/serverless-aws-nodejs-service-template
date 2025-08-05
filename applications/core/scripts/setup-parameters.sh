#!/bin/bash

# SSM Parameter Setup Script
# Creates SSM parameters from JSON configuration file

set -e

# Default values
CONFIG_FILE="config/.env.json"
AWS_PROFILE="playground"
FORCE_UPDATE=false
REGION="ap-southeast-2"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to show usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Creates or updates SSM parameters from a JSON configuration file.

OPTIONS:
    -f, --file FILE         Path to JSON configuration file (default: $CONFIG_FILE)
    -p, --profile PROFILE   AWS profile to use (default: $AWS_PROFILE)
    -r, --region REGION     AWS region (default: $REGION)
    --force                 Force update existing parameters
    -h, --help             Show this help message

EXAMPLES:
    # Create parameters using default settings
    $0

    # Use a different AWS profile
    $0 --profile production

    # Force update existing parameters
    $0 --force

    # Use a custom configuration file
    $0 --file config/custom-parameters.json
EOF
    exit 0
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--file)
            CONFIG_FILE="$2"
            shift 2
            ;;
        -p|--profile)
            AWS_PROFILE="$2"
            shift 2
            ;;
        -r|--region)
            REGION="$2"
            shift 2
            ;;
        --force)
            FORCE_UPDATE=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            print_message "$RED" "Unknown option: $1"
            usage
            ;;
    esac
done

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    print_message "$RED" "Error: Configuration file not found: $CONFIG_FILE"
    exit 1
fi

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_message "$RED" "Error: AWS CLI is not installed"
    exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    print_message "$RED" "Error: jq is not installed. Please install jq to parse JSON."
    exit 1
fi

print_message "$GREEN" "=== SSM Parameter Setup ==="
echo "Configuration file: $CONFIG_FILE"
echo "AWS Profile: $AWS_PROFILE"
echo "AWS Region: $REGION"
echo "Force update: $FORCE_UPDATE"
echo ""

# Read the total number of parameters
TOTAL_PARAMS=$(jq '.parameters | length' "$CONFIG_FILE")
print_message "$GREEN" "Found $TOTAL_PARAMS parameters to process"
echo ""

# Counter for tracking progress
CREATED=0
UPDATED=0
SKIPPED=0
FAILED=0

# Process each parameter
i=0
while [ $i -lt $TOTAL_PARAMS ]; do
    # Extract parameter details
    PARAM_NAME=$(jq -r ".parameters[$i].name" "$CONFIG_FILE")
    PARAM_VALUE=$(jq -r ".parameters[$i].value" "$CONFIG_FILE")
    PARAM_DESC=$(jq -r ".parameters[$i].description" "$CONFIG_FILE")
    PARAM_TYPE=$(jq -r ".parameters[$i].type" "$CONFIG_FILE")
    PARAM_TIER=$(jq -r ".parameters[$i].tier" "$CONFIG_FILE")

    echo "Processing: $PARAM_NAME"

    # Check if parameter exists
    if aws ssm get-parameter --name "$PARAM_NAME" --profile "$AWS_PROFILE" --region "$REGION" &> /dev/null; then
        if [ "$FORCE_UPDATE" = true ]; then
            # Update existing parameter
            if [ "$PARAM_TYPE" = "SecureString" ]; then
                if aws ssm put-parameter \
                    --name "$PARAM_NAME" \
                    --value "$PARAM_VALUE" \
                    --type "$PARAM_TYPE" \
                    --description "$PARAM_DESC" \
                    --tier "$PARAM_TIER" \
                    --overwrite \
                    --profile "$AWS_PROFILE" \
                    --region "$REGION" \
                    --output text &> /dev/null; then
                    print_message "$YELLOW" "  ✓ Updated (SecureString)"
                    UPDATED=$((UPDATED + 1))
                else
                    print_message "$RED" "  ✗ Failed to update"
                    FAILED=$((FAILED + 1))
                fi
            else
                if aws ssm put-parameter \
                    --name "$PARAM_NAME" \
                    --value "$PARAM_VALUE" \
                    --type "$PARAM_TYPE" \
                    --description "$PARAM_DESC" \
                    --tier "$PARAM_TIER" \
                    --overwrite \
                    --profile "$AWS_PROFILE" \
                    --region "$REGION" \
                    --output text &> /dev/null; then
                    print_message "$YELLOW" "  ✓ Updated"
                    UPDATED=$((UPDATED + 1))
                    echo "Updated $UPDATED"
                else
                    print_message "$RED" "  ✗ Failed to update"
                    FAILED=$((FAILED + 1))
                fi
            fi
        else
            print_message "$YELLOW" "  → Skipped (already exists, use --force to update)"
            SKIPPED=$((SKIPPED + 1))
        fi
    else
        # Create new parameter
        if [ "$PARAM_TYPE" = "SecureString" ]; then
            if aws ssm put-parameter \
                --name "$PARAM_NAME" \
                --value "$PARAM_VALUE" \
                --type "$PARAM_TYPE" \
                --description "$PARAM_DESC" \
                --tier "$PARAM_TIER" \
                --profile "$AWS_PROFILE" \
                --region "$REGION" \
                --output text &> /dev/null; then
                print_message "$GREEN" "  ✓ Created (SecureString)"
                CREATED=$((CREATED + 1))
            else
                print_message "$RED" "  ✗ Failed to create"
                ((FAILED++))
            fi
        else
            if aws ssm put-parameter \
                --name "$PARAM_NAME" \
                --value "$PARAM_VALUE" \
                --type "$PARAM_TYPE" \
                --description "$PARAM_DESC" \
                --tier "$PARAM_TIER" \
                --profile "$AWS_PROFILE" \
                --region "$REGION" \
                --output text &> /dev/null; then
                print_message "$GREEN" "  ✓ Created"
                CREATED=$((CREATED + 1))
            else
                print_message "$RED" "  ✗ Failed to create"
                ((FAILED++))
            fi
        fi
    fi

    # Increment counter
    i=$((i + 1))
    echo "Processed $i of $TOTAL_PARAMS parameters"
done

echo ""
print_message "$GREEN" "=== Summary ==="
echo "Created: $CREATED"
echo "Updated: $UPDATED"
echo "Skipped: $SKIPPED"
echo "Failed: $FAILED"

# Exit with error if any failures
if [ $FAILED -gt 0 ]; then
    print_message "$RED" "Some parameters failed to process"
    exit 1
fi

print_message "$GREEN" "✓ Parameter setup complete!"

# If there are SecureString parameters, remind the user to update them
if grep -q '"type": "SecureString"' "$CONFIG_FILE"; then
    echo ""
    print_message "$YELLOW" "⚠ Note: SecureString parameters were created with placeholder values."
    print_message "$YELLOW" "Please update them with actual secure values using:"
    echo "aws ssm put-parameter --name <parameter-name> --value <secure-value> --type SecureString --overwrite --profile $AWS_PROFILE --region $REGION"
fi
