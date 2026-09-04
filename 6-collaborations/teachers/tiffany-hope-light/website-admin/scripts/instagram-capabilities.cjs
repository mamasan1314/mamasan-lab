#!/usr/bin/env node
'use strict';

const { runCli } = require('./instagram-manus-command.cjs');

if (require.main === module) runCli('capabilities');
