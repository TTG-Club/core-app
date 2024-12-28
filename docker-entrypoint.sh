#!/bin/bash

pnpx prisma migrate deploy

exec "${@}"
