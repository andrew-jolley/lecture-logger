def path():
    global path     #global variable 'path' to be used in other functions for finding the file path
    name = "FilePath.txt"   #set name of File Path config txt file
    path = ""   #set path to blank string
    try: 
        path = readTXT(name)[0].replace("\n","")    #set path as the name specified in the txt file
    except Exception:   #error handline
        fatal(f"In function 'path()' - Cannot find '{name}'")   #this error is fatal, so fatal() is used
    return path     #return path (will be blank due to path = "" if there is exception)


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


def readRow(row):   #function to read a whole row
    wb = load_workbook(path)    #open file
    sheet = wb.active
    
    output = [] #define list to collate results
    
    for iterateCols in range (1,sheet.max_column):  #for each column, read the cell
        contents = (sheet.cell(row=row, column=iterateCols).value)
        contents = str(contents)    #convert from NoneType to String for processing
    
        output.append(contents) #add contents to output list to be returned

    return output
    
    
def readMultiRow(start,end,col):    #function to read a set of continuous rows between x-y in a specific column (e.g. a bunch of dates)
    wb = load_workbook(path)    #open workbook
    sheet = wb.active   #set active sheet (1st)
    
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
    sheet = wb.active
    
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
    sheet = wb.active
    
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
    sheet = wb.active
    
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
    quit()
        
        
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
        return output
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
    #print(getInitNotes())
    
    print(find("Cisco"))
    input("Enter to quit")















