import axios from "axios";

export const getFinanceOverview = (month, year) => {

  return axios.get(
    `http://localhost:5000/api/finance/overview?month=${month}&year=${year}`
  );

};