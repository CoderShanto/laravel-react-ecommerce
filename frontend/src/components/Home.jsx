import React from 'react'
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Button from 'react-bootstrap/Button';
import Logo3D from "./common/Logo3D";
import ProductImg from '../assets/images/eight.jpg'



import LatestProducts from './common/LatestProducts';
import FeaturedProducts from './common/FeaturedProducts';
import Header from './common/Header';
import Footer from './common/Footer';
import Hero from './common/Hero';
import Layout from './common/Layout';
import TrendingSearch from './common/TrendingSearch';
import PopularProducts from './common/PopularProducts';
import HomeRecommendations from './common/HomeRecommendations';

const Home = () => {
  return (
    <>
    
    <Layout>
      
      <Hero />

      <TrendingSearch />
      <PopularProducts />
      <HomeRecommendations />
     <LatestProducts />
     
     <FeaturedProducts />

    </Layout>
    
     
     

    
    
    
    
    </>
  )
}

export default Home