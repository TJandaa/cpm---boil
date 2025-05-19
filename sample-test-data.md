# Sample Test Data for CPM Application

To test the network diagram, you can use the following sample tasks:

## Sample Task List

1. **Task A** (ID: A)
   - Duration: 3 days
   - Dependencies: None

2. **Task B** (ID: B)
   - Duration: 2 days
   - Dependencies: A

3. **Task C** (ID: C)
   - Duration: 4 days
   - Dependencies: A

4. **Task D** (ID: D)
   - Duration: 2 days
   - Dependencies: B, C

5. **Task E** (ID: E)
   - Duration: 3 days
   - Dependencies: C

6. **Task F** (ID: F)
   - Duration: 1 day
   - Dependencies: D, E

## How to Test

1. Add each task using the form
2. Click "Calculate CPM" button
3. The network diagram will appear below the results table
4. Critical path tasks will be highlighted in yellow with red borders
5. Drag nodes to reposition them
6. Use scroll wheel or zoom buttons to zoom in/out
7. Click and drag the background to pan the view

## Expected Results

- Critical Path: A → C → E → F
- Project Duration: 11 days
- Tasks B and D will have slack time