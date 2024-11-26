#!/bin/bash

npx prisma migrate deploy

exec "${@}"
