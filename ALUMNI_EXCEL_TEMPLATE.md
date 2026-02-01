# Alumni Excel Upload Template

## Required Excel File Format

Your Excel file should have the following columns (column names are case-insensitive):

### Required Columns:
- **Name** (required) - Full name of the alumni
- **Company** (required) - Company name where alumni works

### Optional Columns:
- **Role** or **Role at Company** - Job title/position
- **Year of passing** or **Year of Passing** - Graduation year
- **Email** - Email address (will be auto-generated if not provided)

## Example Excel File Structure:

| Name | Company | Role | Year of passing | Email |
|------|---------|------|-----------------|-------|
| John Doe | Google | Software Engineer | 2022 | john.doe@example.com |
| Jane Smith | Microsoft | Product Manager | 2021 | jane.smith@example.com |
| Bob Johnson | Amazon | Data Scientist | 2023 | bob.johnson@example.com |

## Accepted Column Name Variations:

The system accepts these variations (case-insensitive):

**For Name:**
- Name, name, NAME
- Full Name, FullName
- Student Name

**For Company:**
- Company, company, COMPANY
- Company Name, CompanyName
- Organization

**For Role:**
- Role, role, ROLE
- Role at Company, RoleAtCompany
- Position, Designation

**For Year:**
- Year of passing, Year of Passing
- YearOfPassing, yearOfPassing
- Year, Passing Year, Graduation Year

**For Email:**
- Email, email, EMAIL
- Email Address, EmailAddress

## Tips:

1. **First row must be headers** - The first row should contain column names
2. **No empty rows** - Remove any completely empty rows
3. **Required fields** - Name and Company are mandatory for each row
4. **Email auto-generation** - If email is not provided, it will be auto-generated as: `firstname.lastname@alumni.byts.com`
5. **File formats** - Supports both `.xlsx` and `.csv` files

## Common Issues:

- **"No data found"** - Make sure your Excel file has data rows (not just headers)
- **"Missing required fields"** - Ensure Name and Company columns are present and filled
- **"Alumni already exists"** - The email address already exists in the system
- **"0 alumni imported"** - Check that column names match the accepted variations

## Sample CSV Format:

```csv
Name,Company,Role,Year of passing,Email
John Doe,Google,Software Engineer,2022,john.doe@example.com
Jane Smith,Microsoft,Product Manager,2021,jane.smith@example.com
```
