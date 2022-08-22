#!/bin/bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

gcloud functions deploy fxfuraffinity --gen2 --source="$SCRIPT_DIR" --entry-point="GenerateEmbed" --region="us-east1" --run-service-account='fxfuraffinity@fxfuraffinity.iam.gserviceaccount.com' --allow-unauthenticated
