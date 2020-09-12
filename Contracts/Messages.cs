﻿using System;
using System.Collections.Generic;

namespace Contracts
{
    [Serializable]
    public abstract class Message
    {
        public int Id { get; set; }
        public string ReplyTo { get; set; }
    }

    [Serializable]
    public class User : Message
    {
        public List<CrawlCommand> QueriesWithResults { get; set; }
    }

    [Serializable]
    public class RemoveQuery : Message
    {
        public CrawlResults CrawlResults { get; set; }
    }

    [Serializable]
    public class QueryRemoved : Message
    {
        
    }

    [Serializable]
    public class TypedMessage : Message
    {
        public QueryForUser QueryForUser { get; set; }
        public QueryFor<Diagram> QueryForDiagram { get; set; }
        public CrawlCommand CrawlCommand { get; set; }
        public CrawlResults CrawlResults { get; set; }
        public RemoveQuery RemoveQuery { get; set; }
        public Diagram Diagram { get; set; }
    }

    [Serializable]
    public class Persisted<T> : Message
    {
        public T Content { get; set; }
    }

    [Serializable]
    public class QueryFor<T> : Message
    {
        
    }

    [Serializable]
    public class Diagram : Message
    {
        public List<Point> Positions { get; set; }
    }

    [Serializable]
    public class Point
    {
        public double X { get; set; }
        public double Y { get; set; }
        public string Src { get; set; }
    }

    [Serializable]
    public class CrawlCommand : Message
    {
        public string StartUrl { get; set; }
        public string[] Follow { get; set; }
        public string[] Collect { get; set; }
        public List<CrawlResults> CrawlResults { get; set; }
    }

    [Serializable]
    public class CrawlResults : Message
    {
        public CrawlResult[] Results { get; set; }
    }

    [Serializable]
    public class CrawlResult : Message
    {
        public string On { get; set; }
        public string From { get; set; }
        public string Found { get; set; }
    }

    [Serializable]
    public class QueryForUser : Message
    {
        
    }
}
