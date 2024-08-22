live Link : https://ecommerce-dashboard-a3ap.onrender.com/ 

Goal
To build a data visualization web 
application that can analyze e-commerce data from a sample Shopify store stored in 
MongoDB.  Build an API layer that reads the data from the database and performs the 
necessary queries to manipulate data and serve it to the front end through a REST API. The 
front end should connect to  API and visualize the data using Chart.js or a similar 
JavaScript visualization library.

MongoDB Collections: You will find the following collections in the RQ_Analytics database:
• shopifyCustomers
• shopifyProducts
• shopifyOrders

 Visualization of data for the following charts:
1. Total Sales Over Time: Use shopifyOrders.total_price_set, grouped/aggregated by 
daily, monthly, quarterly, and yearly intervals.
2. Sales Growth Rate Over Time
3. New Customers Added Over Time: Track the addition of new customers based on 
the created_at field in the shopifyCustomers collection.
4. Number of Repeat Customers: Identify customers with more than one purchase 
across different time frames: daily, monthly, quarterly, and yearly.
5. Geographical Distribution of Customers: Utilize customers.default_address.city to 
visualize the distribution on a map. 
6. Customer Lifetime Value by Cohorts: Group customers based on the month of their 
first purchase and visualize the lifetime value for each cohort.


