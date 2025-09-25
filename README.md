# OTJ Automation Tool

**Author:** Liam Shadwell  
**For use by:** BBC Apprentices on the *Broadcast and Media Systems Engineering Degree Apprenticeship*, in partnership with Birmingham City University.

---

## Get the latest download!

https://github.com/andrew-jolley/lecture-logger/tree/python_packaged

---

## Overview
This tool automates the process of recording **Off-The-Job (OTJ) training hours** into the Excel file provided by BCU.

It provides an interface for apprentices to:

- Enter details about their OTJ activity.
- Automatically record supporting metadata (date, academic year, activity type, location, etc.).
- Link activity to relevant **Knowledge, Skills, and Behaviours (KSBs)** defined in the apprenticeship framework.
- Save entries into the official **OTJ log Excel workbook** in a consistent format.

The tool ensures logs are structured, accurate, and auditable — reducing admin time and helping apprentices stay compliant with the 20% OTJ requirement.

---

## Setup
Before first use, make sure the following are in place:

- **FilePath.txt** → contains the path to the Excel OTJ log workbook. 

The `.exe` version includes everything else needed to run.

---

## Usage
1. Open the **OTJ Automation Tool** application.  
2. Read any initial notes displayed.  
3. Follow the step-by-step prompts to record your OTJ activity.  
4. Once complete, the tool will write the entry into your Excel log and confirm success.

---

## Example Workflow
- Enter the date of the activity: e.g. **24/09/2025**.
- Choose a location: e.g. **BBC Salford MediaCityUK**.  
- Choose an activity type: e.g. **Lecture**.  
- Select a module code: e.g. **DIG4142**.  
- Enter description and details.  
- Add next steps (if any).  
- Enter hours spent.  
- Entry is automatically saved into the Excel OTJ log.

---

## Logging & Errors

Log levels:

- **INFO** – normal program activity.  
- **#ERROR#** – issues that were recovered.  
- **#FATAL#** – program shutdown (restart required).

---

## Notes
- The tool is intended for **apprentice use only** on the BBC/BCU apprenticeship scheme.  
- Do not share this program without prior permission from the author. 
- For support, contact **Liam Shadwell** at **liam.shadwell@bbc.co.uk**.
******
