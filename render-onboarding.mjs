import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { writeFileSync } from 'fs';
import CompanyOnboardingPDF from '/dev-server/src/components/documentation/CompanyOnboardingPDF.tsx';

const blob = await pdf(React.createElement(CompanyOnboardingPDF)).toBuffer();
const chunks = [];
for await (const c of blob) chunks.push(c);
writeFileSync('/mnt/documents/company-onboarding-workbook.pdf', Buffer.concat(chunks));
console.log('ok');
