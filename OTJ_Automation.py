def path():
    global path
    name = "FilePath.txt"
    path = ""
    try: 
        path = readTXT(name)[0].replace("\n","")
    except Exception:
        fatal(f"In function 'path()' - Cannot find '{name}'")
    return path


def readTXT(name): #reads text files
    filename = open(name, 'r') #open file in read mode
    contents = filename.readlines() # read all content from the file and store in var
    filename.close() # close file
    return contents #return the data


def findSetting(name): 
    
    file = "Backend Files (Hidden)/settings.txt"
    
    #print(f"Opening '{file}'")
    
    contents = readTXT(file)
    name = f"{name}:"
    
    for i in range (len(contents)):
        if (removeNewLines(contents[i])) == (removeNewLines(name)):
            line = i
    
    output = (contents[line+1]).replace("\n","")

    return output



    
    
def getInitNotes():
    received = findSetting("Init Notes")
    
    receivedSplit = received.replace("/","\n")
    
    return receivedSplit
    
            
def readCell(row,col): #reads cell with specific coordinate
    wb = load_workbook(path) #open file
    sheet = wb.active #set active sheet
    
    contents = (sheet.cell(row=row, column=col).value) #get all data from the row and col specified
    contents = str(contents) #convert data to string for processing
    
    if contents == "None": #return data if valid
        return(f"NO DATA IN CELL {col}/{row}")
    else:
        return(contents)
    
    
def readCellKSB(row,col): #as above, but specific to KSB sheet
    wb = load_workbook(path)
    sheet = wb["Broadcast & Media KSBs"]#KSB data sheet
    
    contents = (sheet.cell(row=row, column=col).value)
    contents = str(contents)
    
    if contents == "None":
        return(f"NO DATA IN CELL {col}/{row}")
    else:
        return(contents)


def readRow(row):
    wb = load_workbook(path)    #open file
    sheet = wb.active
    
    output = [] #define list to collate results
    
    for iterateCols in range (1,sheet.max_column):  #for each column, read the cell
        contents = (sheet.cell(row=row, column=iterateCols).value)
        contents = str(contents)    #convert from NoneType to String for processing
    
        output.append(contents) #add contents to output list to be returned

    return output
    
    
def readMultiRow(start,end,col):
    wb = load_workbook(path)
    sheet = wb.active
    
    output = []
    
    for i in range (start,end):
        contents = (sheet.cell(row=i, column=col).value)
        contents = str(contents)
    
        if contents == "None":
            output.append(f"NO DATA IN CELL {col}/{i}")
        else:
            output.append(contents)
    
    for i in range(len(output)):
        print (output[i])
    

def readDate(row):
    contents = readCell(row,3)
    if "NO DATA" in contents:
        return contents
    else:
        contents = contents[:-9]
    return contents


def find(term):
    wb = load_workbook(path)
    sheet = wb.active
    
    output = []
    
    for iterateRows in range (18, 146):
        for iterateCols in range(3, sheet.max_column):
            contents = (sheet.cell(row=iterateRows, column=iterateCols).value)
            contents = str(contents)
            
            if term in contents: 
                output.append(f"{iterateRows}/{iterateCols}")
                
    return output if output else "Not Found"

def findInCol(term,col,style):
    wb = load_workbook(path)
    sheet = wb.active
    
    output = []
    total = 0
    
    for iterateRows in range (18, sheet.max_row):
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
    
    

def findInRow(term,row,style):
    wb = load_workbook(path)
    sheet = wb.active
    
    output = []
    total = 0
    
    for iterateCols in range (3, sheet.max_column):
        contents = (sheet.cell(row=row, column=iterateCols).value)
        contents = str(contents)
        
        if term in contents: 
            output.append(f"{row}/{iterateCols}")
            total += 1
                
    if output and style == 1: 
        return output
    elif output and style == 2: 
        return total
    else:
        return "Not found"
    
    
def findInRowKSB(term,style):
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
    
    
def findInColKSB(term,col,style):
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
    


def findFirstBlankRow():    
    return (findInCol("None",3)[0][:-2])


def getKSB(module):
    
    module = module.upper()
    
    printL(f"Getting KSBs for module {module} - please wait...")
    
    rowsWithX = []
    fullKSB = []
    
    received = findInRowKSB(module,1)
    
    column = (str(received[0]))
    column = column.split("/")
    column = int(column[1])
    
    rowsWithXOutput = findInColKSB("x", column, 1)

    for item in rowsWithXOutput:
        parts = item.split("/")   # Split the string at '/'
        number_after_slash = parts[0]   # Take the part after the slash
        rowsWithX.append(number_after_slash)  # Add it to the new list
            
    for item in rowsWithX:
        fullKSB.append(readCellKSB(int(item),2)[:2])
        
    return str(",".join(fullKSB))


def printL(line):
    print(line)
    log(line,1)
    
def log(line,style):
    
    currentTime = (datetime.now()).strftime("%Y-%m-%d %H:%M:%S")
    
    if style == 1:
        output = "INFO    - {} - {}\n".format(currentTime,line)
        wrtTXT("Backend Files (Hidden)/log.txt",output)
    elif style == 2:
        output = "#ERROR# - {} - {}\n".format(currentTime,line)
        wrtTXT("Backend Files (Hidden)/log.txt",output)
    elif style == 999:
        output = "#FATAL# - {} - {}\n".format(currentTime,line)
        wrtTXT("Backend Files (Hidden)/log.txt",output)
    
    elif style == "Start":
        output = "\n\n\nPROGRAM STARTED @ {}\n\n".format(currentTime)
        wrtTXT("Backend Files (Hidden)/log.txt",output)
    
    else: 
        log(f"In function 'log()' - UNKNOWN LOG STYLE '{style}'",2)
        
        
def fatal(line):
    
    log(line,999)
    
    print("\n\n\n")
    print("#########################################################################")
    print("FATAL ERROR - PROGRAM FORCE QUIT IN 5 SECONDS - CONTACT LIAM - SEE LOGS")
    print("#########################################################################")
    time.sleep(5)
   # quit()
        
        
def wrtTXT(file,line):
        
    filename = open(file, 'a') #open file in append mode
    filename.write(line) # write the specified line to the end of the log
    filename.close() # close file    
    
#
#
#
#
#
#

## MISC OTHER ##

import warnings
warnings.simplefilter("ignore", UserWarning)

from openpyxl import load_workbook
from datetime import datetime
import time
import os

# Get the directory of the current script
current_dir = os.path.dirname(os.path.abspath(__file__))

# Change working directory to that folder
os.chdir(current_dir)



def t():
    print("test")
    
def removeNewLines(string):
    try: 
        output = string.replace("\n","")
        return output1
    except Exception:
        fatal("In removeNewLines() - Unable to replace '\n'")
        
    
    

#
#
#
#
#
#

## MAIN PROGRAM ##
log("","Start")   #adds a starting line to the log for the current instance

path()

if path != "":
    print(getInitNotes())
    
    print(removeNewLines("This is a string with a new line \nbefore the before..."))















