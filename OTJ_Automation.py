# =============================================================================
## OTJ_AUTOMATION BY LIAM SHADWELL
## COPYTIGHT LIAM SHADWELL ;)
# =============================================================================


## TEXT FILE FUNCTIONS ##

def path():
    global path     #global variable 'path' to be used in other functions for finding the file path
    name = "FilePath.txt"   #set name of File Path config txt file
    path = ""   #set path to blank string
    try: 
        path = readTXT(name)[0].replace("\n","")    #set path as the name specified in the txt file
    except Exception:   #error handline
        fatal(f"In function 'path()' - Cannot find '{name}'")   #this error is fatal, so fatal() is used
    return path     #return path (will be blank due to path = "" if there is exception)


def wrtTXT(file,line):  #function to write txt to a requested txt file.
    filename = open(file, 'a') #open file in append mode
    filename.write(line) # write the specified line to the end of the file
    filename.close() # close file 
    
    
def readTXT(name): #reads text files
    filename = open(name, 'r') #open file in read mode
    contents = filename.readlines() # read all content from the file and store in var
    filename.close() # close file
    return contents #return the data


def findSetting(name):      #function to find a specified setting from settings.txt
    file = "Backend Files (Hidden)/settings.txt"    #specify file
    
    contents = readTXT(file)    #get all data in the above file
    name = f"{name}:"   #add a colon to the name specified when calling this function
    
    for i in range (len(contents)):     #loop for length of txt file
        if (removeNewLines(contents[i])) == (removeNewLines(name)):     #if name of setting asked for is == the setting found during iteraton
            line = i    #set the line number as i to specifiy the line the name of the setting is found on 
    
    output = (contents[line+1]).replace("\n","")    #set output as the line of the setting name +1 (i.e. the setting option)

    return output   #return the output
    

def getInitNotes():     #function to get the init notes from the settings.txt
    received = findSetting("Init Notes")    #uses findSetting() to get the specified init notes
    
    receivedSplit = received.replace("/","\n")      #replace '/' in the txt file with '\n' to format better in CLI
    
    return receivedSplit    #return the notes

#
#
#
#
#
#

## READ EXCEL FUNCTIONS ##

def readCell(row,col): #reads cell with specific coordinate
    wb = load_workbook(path) #open file
    sheet = wb["OTJ log"] #set active sheet
    
    contents = (sheet.cell(row=row, column=col).value) #get all data from the row and col specified
    contents = str(contents) #convert data to string for processing
    
    if contents == "None": #return data if valid
        return(f"NO DATA IN CELL {col}/{row}")
    else:
        return(contents)


def readRow(row):   #function to read a whole row
    wb = load_workbook(path)    #open file
    sheet = wb["OTJ log"]
    
    output = [] #define list to collate results
    
    for iterateCols in range (1,sheet.max_column):  #for each column, read the cell
        contents = (sheet.cell(row=row, column=iterateCols).value)
        contents = str(contents)    #convert from NoneType to String for processing
    
        output.append(contents) #add contents to output list to be returned

    return output
    
    
def readMultiRow(start,end,col):    #function to read a set of continuous rows between x-y in a specific column (e.g. a bunch of dates)
    wb = load_workbook(path)    #open workbook
    sheet = wb["OTJ log"]   #set active sheet (1st)
    
    output = []     #define output list
    
    for i in range (start,end):     #loop from start to end specified
        contents = (sheet.cell(row=i, column=col).value)    #read the value of the row in the specific column
        contents = str(contents)    #convert to str
    
        if contents == "None":      #if contents are blank, return 'no data' string, else, add the contents to the output
            output.append(f"NO DATA IN CELL {col}/{i}")
        else:
            output.append(contents)
    
    return output
    

def readDate(row):      #specific function to read a date from a specified row
    contents = readCell(row,3)      #uses readCell() to find the data
    if "NO DATA" in contents:   #readCell returns a long string including 'NO DATA'. If present, return the contents as is. 
        return contents
    else:   #if there is data, then remove the time that Excel automatically adds to the cell
        contents = contents[:-9]
    return contents     #return


def find(term):     #function to return the cell ID of a search term (or list of) as a list, e.g. 142/3 or ['93/7', '94/7', '95/7', '96/7', '117/7', '118/7', '119/7', '119/8', '120/7', '124/7']
    wb = load_workbook(path)    #open workbook and set sheet
    sheet = wb["OTJ log"]
    
    output = []     #pre-define output list
    
     
    for iterateRows in range (18, sheet.max_row):     #iterate through each row in the sheet
        for iterateCols in range(3, sheet.max_column):      #for each row, iterate through each column
            contents = (sheet.cell(row=iterateRows, column=iterateCols).value)      #read the cell value
            contents = str(contents)    #convert to str
            
            if term in contents:    #if the term can be found in the cell's contents, then add the Cell's location to the output list
                output.append(f"{iterateRows}/{iterateCols}")
                
    return output if output else "Not Found"    #return output if it exists (i.e. the term could be found)

def findInCol(term,col,style):      #function to find a term in a column and return as either the raw text, or total instances of the term
    wb = load_workbook(path)    #open workbook and sheet
    sheet = wb["OTJ log"]
    
    output = []     #define output list
    total = 0       #define total variable
    
    for iterateRows in range (18, sheet.max_row):       #iterate through all rows
        contents = (sheet.cell(row=iterateRows, column=col).value)      #read the cell contents 
        contents = str(contents)    #convert to str
        
        if term in contents:        #if the term can be found in the cell's contents, then add the Cell's location to the output list
            output.append(f"{iterateRows}/{col}")
            total += 1      #used for style 2 (total instances). Increase total by 1
                
    if output and style == 1:   #return output list for style 1
        return output
    elif output and style == 2: #return total count for style 2
        return total
    else:
        return "Not found"  #if not found, return not found
    
    

def findInRow(term,row,style):      #find a term in a row
    wb = load_workbook(path)    #open workbook
    sheet = wb["OTJ log"]
    
    output = []     #define list and vars
    total = 0
    
    for iterateCols in range (3, sheet.max_column):     #iterate through all valid columns
        contents = (sheet.cell(row=row, column=iterateCols).value)      #get contents of cell
        contents = str(contents)    #convert to str
        
        if term in contents:    #if term is in the cell contents
            output.append(f"{row}/{iterateCols}")   #add the cell location to the output
            total += 1  #increase count by 1
                
    if output and style == 1:   #if using style 1 (list of cells), return output
        return output
    elif output and style == 2: #if using style 2 (total count of matches), return count
        return total
    else:
        return "Not found"  #else, return not found
    

def findFirstBlankRow():    #finds the first blank row in the .xlsx where the data should be written. Note, this is the first row with no data, not the first with no formatting (thats ~2000). 
    return (findInCol("None",3,1)[0][:-2])    #uses find in col, passed 'None' and asks for column 3 style 1, which returns the coordinates. 


#
#
#
#
#
#

## WRITING TO EXCEL ##

def writeRow(row): 
    global rowData
    wb = load_workbook(path)
    sheet = wb["OTJ log"]
    
    for col, value in enumerate(rowData, start=1):  # start=1 means column A
        sheet.cell(row=row, column=col, value=value)
    
    wb.save(path)
    rowData = []    #reset row data list to avoid duplicate entries
    

def addDate():
    date = input("Enter date of activity (or enter 'today'):    ")
    date = dateToUse.lower()
    
    if date == "today": 
        date = (datetime.now()).strftime("%Y-%m-%d")
    
    rowData.append(date)

    print(f"Got it, using '{date}'.")    
    log(f"Added date:'{date}' to 'rowData' list",1)
    
    
def addLocation():
    location = input("Enter Location of activity:    ")
    location = dateToUse.lower()
    
    rowData.append(location)

    print(f"Got it, using '{location}'.")    
    log(f"Added location:'{location}' to 'rowData' list",1)


#
#
#
#
#
#


## READ EXCEL FOR KSBs ##

def readCellKSB(row,col): #as above, but specific to KSB sheet
    wb = load_workbook(path)
    sheet = wb["Broadcast & Media KSBs"]#KSB data sheet
    
    contents = (sheet.cell(row=row, column=col).value)
    contents = str(contents)
    
    if contents == "None":
        return(f"NO DATA IN CELL {col}/{row}")
    else:
        return(contents)
    
    
def findInRowKSB(term,style):   #as above, but using sheet Broadcast & Media KSBs
    wb = load_workbook(path)
    sheet = wb["Broadcast & Media KSBs"]    
    
    output = []
    total = 0
    
    for iterateCols in range (3, sheet.max_column):
        contents = (sheet.cell(row=2, column=iterateCols).value)
        contents = str(contents)
        
        if term in contents: 
            output.append(f"2/{iterateCols}")
            total += 1
            
    if output and style == 1: 
        return output
    elif output and style == 2: 
        return total
    else:
        return "Not found"
    
    
def findInColKSB(term,col,style):       #as seen in findInCol(), but using the sheet with the KSBs defined
    wb = load_workbook(path)
    sheet = wb["Broadcast & Media KSBs"]    
    
    output = []
    total = 0
    
    for iterateRows in range (1, sheet.max_row):
        contents = (sheet.cell(row=iterateRows, column=col).value)
        contents = str(contents)
        
        if term in contents: 
            output.append(f"{iterateRows}/{col}")
            total += 1
                
    if output and style == 1: 
        return output
    elif output and style == 2: 
        return total
    else:
        return "Not found"
    
    
def getKSB(module):  #gets KSBs given a module
    
    module = module.upper()     #input validation
    
    print(f"Getting KSBs for module {module} - please wait...")    #waiting message
    
    rowsWithX = []      #init lists
    fullKSB = []
    
    received = findInRowKSB(module,1)   #find in KSB sheet header row the column which matches the required module code. 
    
    column = (str(received[0]))     #string
    column = column.split("/")  #split by /
    column = int(column[1])     #set the column number as int for later use. 
    
    rowsWithXOutput = findInColKSB("x", column, 1)  #check any rows in the column found above for 'x', denoting they are linked to the inputted module. 

    for item in rowsWithXOutput:    
        parts = item.split("/")   # Split the string at '/'
        number_after_slash = parts[0]   # Take the part after the slash
        rowsWithX.append(number_after_slash)  # Add it to the new list
            
    for item in rowsWithX:
        fullKSB.append(readCellKSB(int(item),2)[:2])
        
    return str(",".join(fullKSB))


#
#
#
#
#
#
    
## MISC FUNCTIONS ## 

def t():    #subroutine to easily print a test line
    print("test")
    
    
def removeNewLines(string):     #function to remove new lines where needed, instead of typing out '.replace(fubfj)
    try:    #error handling
        output = string.replace("\n","")    #take the inputted string, and remove the \n
        return output
    except Exception:   #if error, then file name exception could occur, requiring fatal error closure
        fatal("In removeNewLines() - Unable to replace '\n'")
        

def printL(line):   #function to print and log the input
    print(line)
    log(line,1)
    

def log(line,style):    #function to log input with either info, error or fatal tags at the start. 
    
    currentTime = (datetime.now()).strftime("%Y-%m-%d %H:%M:%S")    #get current time
    
    if style == 1:      #depending on the style, use wrtTXT() to write the output defined to the log.txt file in Backend Files. 
        output = "INFO    - {} - {}\n".format(currentTime,line)
        wrtTXT("Backend Files (Hidden)/log.txt",output)
    elif style == 2:
        output = "#ERROR# - {} - {}\n".format(currentTime,line)
        wrtTXT("Backend Files (Hidden)/log.txt",output)
    elif style == 999:
        output = "#FATAL# - {} - {}\n".format(currentTime,line)
        wrtTXT("Backend Files (Hidden)/log.txt",output)
    
    elif style == "Start":      #used to generate a program started message to clearly show a new instance. 
        output = "\n\n\nPROGRAM STARTED @ {}\n\n".format(currentTime)
        wrtTXT("Backend Files (Hidden)/log.txt",output)
    
    else:   #if the log style cannot be defined, recur back through and send error message.  
        log(f"In function 'log()' - UNKNOWN LOG STYLE '{style}'",2)
        
        
def fatal(line):    #function to kill program if fatal error
                    #call this function from other functions where a fatal error exception could occur
    log(line,999)   #auto log fatal error
    
    print("\n\n\n")     #print error into CLI
    print("#########################################################################")
    print("FATAL ERROR - PROGRAM FORCE QUIT IN 5 SECONDS - CONTACT LIAM - SEE LOGS")
    print("#########################################################################")
    time.sleep(5)   #wait 5 sec before closing program
    quit()  #close program
        
#
#
#
#
#
#

## MISC OTHER ##

import warnings    #import warnings to silence any data warnings from OpenPyXL in the running CLI
warnings.simplefilter("ignore", UserWarning)

from openpyxl import load_workbook   #import openpyxl
from datetime import datetime    #these are pretty obvious
import time
import os

# Get the directory of the current script
current_dir = os.path.dirname(os.path.abspath(__file__))
# Change working directory to that folder
os.chdir(current_dir)

rowData = []    #define for adding entries to instances of writing rows


#
#
#
#
#
#

## MAIN PROGRAM ##
log("","Start")   #adds a starting line to the log for the current instance

path()  #gets the file path for the Excel file

if path != "":  #if path exists
    print(getInitNotes())
    
    writeCell(148,3,"22/09/2025")
    #print(readCell(148,3))
    print(readDate(148))
    

writeRow()












