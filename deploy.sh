#!/bin/bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

gcloud functions deploy fxfuraffinity --gen2 --source="$SCRIPT_DIR" --run-service-account='fxfuraffinity@fxfuraffinity.iam.gserviceaccount.com' --allow-unauthenticated
