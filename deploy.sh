#!/bin/bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

if [[ "$1" = "--prod" ]]; then
  echo "Deploying in production"
  gcloud functions deploy fxfuraffinity --gen2 --runtime=go116 --source="$SCRIPT_DIR" --entry-point="HandleRequest" --region="us-east1" --run-service-account='fxfuraffinity@fxfuraffinity.iam.gserviceaccount.com' --trigger-http --allow-unauthenticated
else
  echo "Deploying in development"
  gcloud functions deploy fxfuraffinity-dev --gen2 --runtime=go116 --source="$SCRIPT_DIR" --entry-point="HandleRequest" --region="us-east1" --run-service-account='fxfuraffinity@fxfuraffinity.iam.gserviceaccount.com' --trigger-http
fi
