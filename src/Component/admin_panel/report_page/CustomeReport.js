import * as React from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';

// Sample data
const MonthlyData = [
    {
        date: "2024-07-01",
        categories: [
            {
                categoryName: "મુર્તિ", quantity: 134, amount: 4324, product: [
                    { name: "બાલુડા_૧", pro_price: 7500, pro_quantity: 8 },
                    { name: "બાલુડા_૨", pro_price: 15000, pro_quantity: 45 },
                    { name: "બાલુડા_૩", pro_price: 15000, pro_quantity: 23 },
                    { name: "રાજાધિરાજ", pro_price: 15000, pro_quantity: 23 }
                ]
            },
            {
                categoryName: "વાઘા", quantity: 10, amount: 100, product: [
                    { name: "વાઘા_નં._1", pro_price: 67500, pro_quantity: 22 },
                    { name: "ઘેરવાળા_2", pro_price: 17890, pro_quantity: 234 }
                ]
            },
            {
                categoryName: "ઘરેણા", quantity: 76, amount: 3237, product: [
                    { name: "1_ઘરેણા", pro_price: 7500, pro_quantity: 2 },
                    { name: "2_ઘરેણા", pro_price: 15000, pro_quantity: 54 }
                ]
            },
            {
                categoryName: "પુજા", quantity: 43242, amount: 432, product: [
                    { name: "Product A", pro_price: 553, pro_quantity: 6 },
                    { name: "Product B", pro_price: 7868, pro_quantity: 243 }
                ]
            },
            {
                categoryName: "પુસ્તક", quantity: 243, amount: 645645, product: [
                    { name: "Product A", pro_price: 6564, pro_quantity: 121 },
                    { name: "Product B", pro_price: 86865, pro_quantity: 76 }
                ]
            },
            {
                categoryName: "જનરલ", quantity: 23, amount: 7676, product: [
                    { name: "Product A", pro_price: 7500, pro_quantity: 76 },
                    { name: "Product B", pro_price: 15000, pro_quantity: 45 }
                ]
            },
        ]
    },
    {
        date: "2024-07-02",
        categories: [
            {
                categoryName: "મુર્તિ", quantity: 98, amount: 10320, product: [
                    { name: "બાલુડા_૧", pro_quantity: 32, pro_price: 2382 },
                    { name: "બાલુડા_૨", pro_quantity: 45, pro_price: 15000 },
                    { name: "બાલુડા_૩", pro_quantity: 13, pro_price: 323 },
                    { name: "રાજાધિરાજ", pro_quantity: 29, pro_price: 154000 }
                ]
            },
            {
                categoryName: "વાઘા", quantity: 10, amount: 100, product: [
                    { name: "વાઘા_નં._1", pro_quantity: 22, pro_price: 7500, },
                    { name: "ઘેરવાળા_2", pro_quantity: 1, pro_price: 15000, }
                ]
            },
            {
                categoryName: "ઘરેણા", quantity: 10, amount: 100, product: [
                    { name: "1_ઘરેણા", pro_quantity: 2, pro_price: 7500, },
                    { name: "2_ઘરેણા", pro_quantity: 5, pro_price: 15000, }
                ]
            },
            {
                categoryName: "પુજા", quantity: 10, amount: 100, product: [
                    { name: "Product A", pro_quantity: 1, pro_price: 7500 },
                    { name: "Product B", pro_quantity: 1, pro_price: 1500 }
                ]
            },
            {
                categoryName: "પુસ્તક", quantity: 10, amount: 100, product: [
                    { name: "Product A", pro_quantity: 1, pro_price: 7500 },
                    { name: "Product B", pro_quantity: 1, pro_price: 1500 }
                ]
            },
            {
                categoryName: "જનરલ", quantity: 10, amount: 100, product: [
                    { name: "Product A", pro_quantity: 1, pro_price: 7500 },
                    { name: "Product B", pro_quantity: 1, pro_price: 15000 }
                ]
            },
        ]
    },
    {
        date: "2024-07-03",
        categories: [
            {
                categoryName: "મુર્તિ", quantity: 4545, amount: 23432, product: [
                    { name: "બાલુડા_૧", pro_price: 7500, pro_quantity: 8 },
                    { name: "બાલુડા_૨", pro_price: 15000, pro_quantity: 45 },
                    { name: "બાલુડા_૩", pro_price: 15000, pro_quantity: 23 },
                    { name: "રાજાધિરાજ", pro_price: 15000, pro_quantity: 23 }
                ]
            },
            {
                categoryName: "વાઘા", quantity: 10, amount: 100, product: [
                    { name: "વાઘા_નં._1", pro_price: 7500, pro_quantity: 22 },
                    { name: "ઘેરવાળા_2", pro_price: 15000, pro_quantity: 1 }
                ]
            },
            {
                categoryName: "ઘરેણા", quantity: 10, amount: 100, product: [
                    { name: "1_ઘરેણા", pro_price: 7500, pro_quantity: 2 },
                    { name: "2_ઘરેણા", pro_price: 15000, pro_quantity: 54 }
                ]
            },
            {
                categoryName: "પુજા", quantity: 10, amount: 100, product: [
                    { name: "Product A", pro_price: 7500, pro_quantity: 1 },
                    { name: "Product B", pro_price: 15000, pro_quantity: 1 }
                ]
            },
            {
                categoryName: "પુસ્તક", quantity: 10, amount: 100, product: [
                    { name: "Product A", pro_price: 7500, pro_quantity: 1 },
                    { name: "Product B", pro_price: 15000, pro_quantity: 1 }
                ]
            },
            {
                categoryName: "જનરલ", quantity: 10, amount: 100, product: [
                    { name: "Product A", pro_price: 7500, pro_quantity: 1 },
                    { name: "Product B", pro_price: 15000, pro_quantity: 1 }
                ]
            },
        ]
    },
    {
        date: "2024-07-04",
        categories: [
            {
                categoryName: "મુર્તિ", quantity: 6456, amount: 345345, product: [
                    { name: "બાલુડા_૧", pro_price: 7500, pro_quantity: 8 },
                    { name: "બાલુડા_૨", pro_price: 15000, pro_quantity: 45 },
                    { name: "બાલુડા_૩", pro_price: 15000, pro_quantity: 23 },
                    { name: "રાજાધિરાજ", pro_price: 15000, pro_quantity: 23 }
                ]
            },
            {
                categoryName: "વાઘા", quantity: 185, amount: 45473, product: [
                    { name: "વાઘા_નં._1", pro_price: 5433, pro_quantity: 22 },
                    { name: "ઘેરવાળા_2", pro_price: 3276567, pro_quantity: 656 }
                ]
            },
            {
                categoryName: "ઘરેણા", quantity: 1231, amount: 6554, product: [
                    { name: "1_ઘરેણા", pro_price: 5353, pro_quantity: 2 },
                    { name: "2_ઘરેણા", pro_price: 876, pro_quantity: 54 }
                ]
            },
            {
                categoryName: "પુજા", quantity: 10, amount: 100, product: [
                    { name: "Product A", pro_price: 7500, pro_quantity: 15 },
                    { name: "Product B", pro_price: 15000, pro_quantity: 18 }
                ]
            },
            {
                categoryName: "પુસ્તક", quantity: 343, amount: 65464, product: [
                    { name: "Product A", pro_price: 43432, pro_quantity: 432 },
                    { name: "Product B", pro_price: 2324543, pro_quantity: 25 }
                ]
            },
            {
                categoryName: "જનરલ", quantity: 10, amount: 100, product: [
                    { name: "Product A", pro_price: 343, pro_quantity: 64 },
                    { name: "Product B", pro_price: 5656, pro_quantity: 45 }
                ]
            },
        ]
    }
];

// Helper function to get unique dates
const getUniqueDates = (data) => {
    const dates = data.map(item => item.date);
    return [...new Set(dates)];
};

// Helper function to generate dynamic columns
const generateDynamicColumns = (dates) => {
    const dateColumns = dates.flatMap(date => [
        { id: `qty_${date}`, label: `Qty`, minWidth: 80, align: 'right' },
        { id: `amount_${date}`, label: `Amount`, minWidth: 100, align: 'right' }
    ]);
    return [
        { id: 'sr_no', label: 'Sr No.', minWidth: 30 },
        { id: 'category_name', label: 'Category Name', minWidth: 120 },
        { id: 'product_name', label: 'Product Name', minWidth: 130 },
        ...dateColumns,
        { id: 'total_qty', label: 'Total Qty', minWidth: 80, align: 'right' },
        { id: 'total_amount', label: 'Total Amount', minWidth: 100, align: 'right' }
    ];
};

// Helper function to generate rows
const generateRows = (data, dates) => {
    const rows = [];
    const categoryRows = new Map();
    const productRows = new Map();

    let srNo = 1;

    // Initialize rows for categories and products
    data.forEach(dateData => {
        dateData.categories.forEach(category => {
            // Initialize or update the category row
            if (!categoryRows.has(category.categoryName)) {
                const categoryRow = {
                    sr_no: srNo++,
                    category_name: category.categoryName,
                    product_name: '',
                    isCategory: true,
                    expanded: false,
                    ...dates.reduce((acc, date) => {
                        const categoryData = dateData.categories.find(c => c.categoryName === category.categoryName);
                        acc[`qty_${date}`] = categoryData ? categoryData.quantity : 0;
                        acc[`amount_${date}`] = categoryData ? categoryData.amount : 0;
                        return acc;
                    }, {}),
                    total_qty: 0,
                    total_amount: 0
                };
                categoryRows.set(category.categoryName, categoryRow);
                rows.push(categoryRow);
            }

            // Initialize the product map for the category
            if (!productRows.has(category.categoryName)) {
                productRows.set(category.categoryName, new Set());
            }

            // Add product rows for the category
            category.product.forEach(product => {
                if (!productRows.get(category.categoryName).has(product.name)) {
                    productRows.get(category.categoryName).add(product.name);
                    rows.push({
                        sr_no: srNo++,
                        category_name: category.categoryName,
                        product_name: product.name,
                        isCategory: false,
                        ...dates.reduce((acc, date) => {
                            const productData = dateData.categories.find(c => c.categoryName === category.categoryName)
                                .product
                                .find(p => p.name === product.name);
                            acc[`qty_${date}`] = productData ? productData.pro_quantity : 0;
                            acc[`amount_${date}`] = productData ? productData.pro_price * (productData.pro_quantity || 0) : 0;
                            return acc;
                        }, {}),
                        total_qty: 0,
                        total_amount: 0
                    });
                }
            });
        });
    });

    // Calculate totals for products and categories
    dates.forEach(date => {
        const qtyColumn = `qty_${date}`;
        const amountColumn = `amount_${date}`;

        // Reset totals
        rows.forEach(row => {
            row.total_qty = 0;
            row.total_amount = 0;
        });

        // Calculate product totals
        rows.forEach(row => {
            if (!row.isCategory) {
                const categoryRow = rows.find(r => r.isCategory && r.category_name === row.category_name);
                if (categoryRow) {
                    categoryRow.total_qty += parseFloat(row[qtyColumn]) || 0;
                    categoryRow.total_amount += parseFloat(row[amountColumn]) || 0;
                }
                row.total_qty = parseFloat(row[qtyColumn]) || 0;
                row.total_amount = parseFloat(row[amountColumn]) || 0;
            }
        });

        // Calculate category totals
        rows.forEach(row => {
            if (row.isCategory) {
                row.total_qty = rows
                    .filter(r => !r.isCategory && r.category_name === row.category_name)
                    .reduce((sum, r) => sum + (parseFloat(r[qtyColumn]) || 0), 0);
                row.total_amount = rows
                    .filter(r => !r.isCategory && r.category_name === row.category_name)
                    .reduce((sum, r) => sum + (parseFloat(r[amountColumn]) || 0), 0);
            }
        });
    });

    // Calculate overall totals
    const overallTotals = dates.reduce((acc, date) => {
        const qtyColumn = `qty_${date}`;
        const amountColumn = `amount_${date}`;
        acc.total_qty[date] = rows
            .filter(row => !row.isCategory)
            .reduce((sum, row) => sum + (parseFloat(row[qtyColumn]) || 0), 0);
        acc.total_amount[date] = rows
            .filter(row => !row.isCategory)
            .reduce((sum, row) => sum + (parseFloat(row[amountColumn]) || 0), 0);
        return acc;
    }, { total_qty: {}, total_amount: {} });

    return { rows, overallTotals };
};




// Main component
export default function CustomeReport() {
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const [expandedCategories, setExpandedCategories] = React.useState(new Set());

    const dates = getUniqueDates(MonthlyData);
    const { rows, overallTotals } = generateRows(MonthlyData, dates);
    const dynamicColumns = generateDynamicColumns(dates);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    const handleCategoryClick = (categoryRowId) => {
        setExpandedCategories(prev => {
            const newExpandedCategories = new Set(prev);
            if (newExpandedCategories.has(categoryRowId)) {
                newExpandedCategories.delete(categoryRowId);
            } else {
                newExpandedCategories.add(categoryRowId);
            }
            return newExpandedCategories;
        });
    };

    return (
        <Paper sx={{ width: '100%' }}>
            <TableContainer sx={{ maxHeight: 540 }}>
                <Table stickyHeader aria-label="sticky table">
                    <TableHead>
                        <TableRow>
                            <TableCell align="center"></TableCell>
                            <TableCell align="center"></TableCell>
                            <TableCell align="center"></TableCell>
                            {dates.map(date => (
                                <React.Fragment key={date}>
                                    <TableCell align="center" colSpan={2}>{date}</TableCell>
                                </React.Fragment>
                            ))}
                            <TableCell align="center">Total</TableCell>
                            <TableCell align="center"></TableCell>
                        </TableRow>
                        <TableRow>
                            {dynamicColumns.map((column) => (
                                <TableCell
                                    key={column.id}
                                    align={column.align}
                                    style={{ minWidth: column.minWidth }}
                                >
                                    {column.label}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((row) => (
                                <React.Fragment key={row.sr_no}>
                                    {row.isCategory ? (
                                        <TableRow
                                            hover
                                            role="checkbox"
                                            tabIndex={-1}
                                            key={row.sr_no}
                                            onClick={() => handleCategoryClick(row.sr_no)}
                                        >
                                            {dynamicColumns.map((column) => (
                                                <TableCell key={column.id} align={column.align}>
                                                    {row[column.id] !== undefined ? row[column.id] : ''}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ) : null}

                                    {/* Render products if category is expanded */}
                                    {expandedCategories.has(row.sr_no) && rows
                                        .filter(r => r.product_name !== '' && !r.isCategory && r.category_name === row.category_name)
                                        .map((productRow) => (
                                            <TableRow key={productRow.sr_no}>
                                                <TableCell></TableCell>
                                                <TableCell></TableCell>
                                                <TableCell>{productRow.product_name}</TableCell>
                                                {dates.map(date => (
                                                    <React.Fragment key={date}>
                                                        <TableCell align="right">
                                                            {productRow[`qty_${date}`]}
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            {productRow[`amount_${date}`]}
                                                        </TableCell>
                                                    </React.Fragment>
                                                ))}
                                                <TableCell align="right">
                                                    {productRow.total_qty}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {productRow.total_amount}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    }
                                </React.Fragment>
                            ))}
                        {/* Render Total row */}
                        <TableRow>
                            <TableCell colSpan={3}>Total</TableCell>
                            {dates.map(date => (
                                <React.Fragment key={date}>
                                    <TableCell align="right">
                                        {overallTotals.total_qty[date] || 0}
                                    </TableCell>
                                    <TableCell align="right">
                                        {overallTotals.total_amount[date] || 0}
                                    </TableCell>
                                </React.Fragment>
                            ))}
                            <TableCell align="right">
                                {rows.filter(r => r.isCategory)
                                     .reduce((sum, r) => sum + r.total_qty, 0)}
                            </TableCell>
                            <TableCell align="right">
                                {rows.filter(r => r.isCategory)
                                     .reduce((sum, r) => sum + r.total_amount, 0)}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[10, 25, 100]}
                component="div"
                count={rows.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </Paper>
    );
}
