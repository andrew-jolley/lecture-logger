##UNUSED FUNCTIONS##

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



def readRow(row):   #function to read a whole row
    wb = load_workbook(path)    #open file
    sheet = wb["OTJ log"]
    
    output = [] #define list to collate results
    
    for iterateCols in range (1,sheet.max_column):  #for each column, read the cell
        contents = (sheet.cell(row=row, column=iterateCols).value)
        contents = str(contents)    #convert from NoneType to String for processing
    
        output.append(contents) #add contents to output list to be returned

    return output


def printL(line):   #function to print and log the input
    print(line)
    log(line,1)