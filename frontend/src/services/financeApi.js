import axios from "axios";

export const getFinanceOverview = (month, year) => {

  return axios.get(
    `http://${window.location.hostname}:8800/api/finance/overview?month=${month}&year=${year}`
  );

};